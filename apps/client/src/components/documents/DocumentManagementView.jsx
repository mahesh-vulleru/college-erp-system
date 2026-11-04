import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Shield,
  Trash2,
  RefreshCw,
  FolderOpen
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
  { value: 'all', label: 'All Categories' },
  { value: 'academic', label: 'Academic & Syllabi' },
  { value: 'identity', label: 'Identity & Certificates' },
  { value: 'financial', label: 'Financial & Fee Receipts' },
  { value: 'transport', label: 'Transport & Vehicle Compliance' },
  { value: 'administrative', label: 'Administrative & Circulars' },
  { value: 'policy', label: 'Institutional Policies' }
];

export default function DocumentManagementView() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'academic',
    documentType: 'PDF Document',
    fileName: '',
    fileSize: 1048576, // 1MB mock default
    mimeType: 'application/pdf',
    description: '',
    allowedRoles: ['*']
  });

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      const res = await api.getDocuments(params);
      setDocuments(res.data || []);
    } catch (err) {
      addToast({ type: 'error', title: 'Documents Error', message: err.message || 'Failed to fetch documents' });
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, addToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      addToast({ type: 'error', title: 'Validation', message: 'Document title is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...uploadForm,
        fileName: uploadForm.fileName || `${uploadForm.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`
      };
      await api.uploadDocument(payload);
      addToast({ type: 'success', title: 'Document Stored', message: 'File securely registered and encrypted in ERP repository.' });
      setIsUploadOpen(false);
      setUploadForm({
        title: '',
        category: 'academic',
        documentType: 'PDF Document',
        fileName: '',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        description: '',
        allowedRoles: ['*']
      });
      fetchDocuments();
    } catch (err) {
      addToast({ type: 'error', title: 'Upload Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.downloadDocument(doc._id);
      addToast({
        type: 'info',
        title: 'Document Decrypted',
        message: `Authorized access granted for ${doc.title} (Key: ${res.data?.fileKey || 'Verified'}).`
      });
      fetchDocuments();
    } catch (err) {
      addToast({ type: 'error', title: 'Download Error', message: err.message });
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title?.toLowerCase().includes(q) ||
      d.category?.toLowerCase().includes(q) ||
      d.fileName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-teal-600" />
            Institutional Document & Certificate Repository
          </h2>
          <p className="text-xs text-navy-500 mt-0.5">
            Role-governed document storage with audit tracking, secure file keys, and tamper verification.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchDocuments} isLoading={isLoading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-navy-100 shadow-subtle">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-navy-400" />
          <input
            type="text"
            placeholder="Search document title or file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs rounded-lg border border-navy-200 px-2.5 py-1.5 bg-white text-navy-800"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Documents Grid / Table */}
      <Card>
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-navy-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No documents found</p>
            <p className="text-xs text-navy-500">Upload or request official files via the upload button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filteredDocs.map((doc) => (
              <div key={doc._id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-navy-900">{doc.title}</span>
                    <Badge variant="cyan" size="xs">{doc.category}</Badge>
                    <Badge variant="slate" size="xs">{doc.documentType || 'Official'}</Badge>
                  </div>
                  <p className="text-[11px] text-navy-500 font-mono">
                    File: {doc.fileName} • Size: {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded by {doc.uploadedBy?.name || 'Administrator'}
                  </p>
                  {doc.description && <p className="text-xs text-navy-600">{doc.description}</p>}
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right text-[11px] text-navy-400">
                    <div>{doc.downloadCount || 0} downloads</div>
                    <div>{new Date(doc.createdAt).toLocaleDateString()}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Access
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upload Document Modal */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Official Document" size="md">
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-700 mb-1">Document Title</label>
            <Input
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              placeholder="e.g. Semester 3 Academic Syllabus / Vehicle Fitness Certificate"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-700 mb-1">Category</label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                className="w-full border border-navy-200 rounded-lg px-2.5 py-1.5 bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
              >
                {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-700 mb-1">Document Format / Type</label>
              <Input
                value={uploadForm.documentType}
                onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                placeholder="e.g. Marksheet, Policy, ID Card"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-700 mb-1">File Name</label>
            <Input
              value={uploadForm.fileName}
              onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
              placeholder="e.g. academic_syllabus_2025.pdf"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-700 mb-1">Description / Notes (Optional)</label>
            <textarea
              rows={3}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Institutional remarks or verification notes..."
              className="w-full border border-navy-200 rounded-lg p-2.5 text-xs text-navy-800 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Upload & Secure
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

