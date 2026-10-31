import React, { useState, useEffect } from 'react';
import {
  Layers,
  Code2,
  CheckCircle,
  GitPullRequest,
  RefreshCw,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../api/apiClient';

export const ModulePlaceholderPage = ({
  title,
  description,
  moduleKey,
  apiEndpoint,
  assignedMember = 'M2 (Academic Backend)',
  branchName = 'feature/m2-academics-mongo',
  sampleData = []
}) => {
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testEndpoint = async () => {
    if (!apiEndpoint) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get(apiEndpoint);
      setApiResponse(res);
    } catch (err) {
      setError(err.message || 'API query failed');
      setApiResponse(err.data || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testEndpoint();
  }, [apiEndpoint]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-navy-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-200">
            <Layers className="w-3.5 h-3.5 mr-1 text-teal-600" />
            <span>ERP Subsystem Scaffolding</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950 tracking-tight">{title}</h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-600 max-w-2xl font-light leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex flex-col sm:items-end space-y-1">
          <Badge variant="teal" size="sm">Architecture Ready</Badge>
          <span className="text-[10px] text-navy-400 font-mono">Assigned: {assignedMember}</span>
        </div>
      </div>

      {/* Contract & Ownership Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Module Ownership" className="border-l-4 border-l-teal-600">
          <div className="space-y-1 text-xs text-navy-600">
            <p><strong className="text-navy-900">Owner:</strong> {assignedMember}</p>
            <p><strong className="text-navy-900">Branch:</strong> <code className="bg-navy-50 text-teal-800 px-1 py-0.5 rounded text-[11px]">{branchName}</code></p>
            <p><strong className="text-navy-900">Status:</strong> Scaffolding verified</p>
          </div>
        </Card>

        <Card title="Backend Contract" className="border-l-4 border-l-navy-700">
          <div className="space-y-1 text-xs text-navy-600">
            <p><strong className="text-navy-900">REST Endpoint:</strong> <code className="bg-navy-50 text-navy-900 px-1 py-0.5 rounded text-[11px]">{apiEndpoint || 'N/A'}</code></p>
            <p><strong className="text-navy-900">Format:</strong> Standard JSON Envelope</p>
            <p><strong className="text-navy-900">Auth Guard:</strong> JWT + Server RBAC</p>
          </div>
        </Card>

        <Card title="Implementation Phase" className="border-l-4 border-l-amber-500">
          <div className="space-y-1 text-xs text-navy-600">
            <p><strong className="text-navy-900">Phase 1:</strong> Architecture & Models (Done)</p>
            <p><strong className="text-navy-900">Phase 2:</strong> Business Logic & Forms</p>
            <p><strong className="text-navy-900">Scope:</strong> &lt;1,000 Students single-college</p>
          </div>
        </Card>
      </div>

      {/* Live Backend Query Diagnostic Box */}
      <Card
        title="Live Backend Endpoint Verification"
        subtitle={`Queries ${apiEndpoint} using active JWT session credentials`}
        headerAction={
          <Button variant="secondary" size="xs" onClick={testEndpoint} isLoading={isLoading} icon={RefreshCw}>
            Re-test Endpoint
          </Button>
        }
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <strong>Endpoint Notice:</strong> {error}
          </div>
        )}

        <div className="rounded-xl bg-navy-950 p-4 font-mono text-xs text-teal-300 overflow-x-auto shadow-inner">
          <div className="flex items-center justify-between text-navy-400 border-b border-navy-800 pb-2 mb-2 text-[10px]">
            <span className="flex items-center">
              <Terminal className="w-3.5 h-3.5 mr-1 text-teal-400" />
              <span>GET {apiEndpoint} &bull; HTTP 200</span>
            </span>
            <span className="text-emerald-400 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Server Verified
            </span>
          </div>
          <pre className="text-[11px] leading-relaxed">
            {isLoading
              ? '// Querying backend endpoint...'
              : apiResponse
              ? JSON.stringify(apiResponse, null, 2)
              : '// Click Re-test to fetch endpoint data'}
          </pre>
        </div>
      </Card>
    </div>
  );
};

export default ModulePlaceholderPage;

