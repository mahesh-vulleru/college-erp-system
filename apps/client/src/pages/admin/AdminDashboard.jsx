import React from 'react';
import {
  ShieldAlert,
  Users,
  Database,
  Lock,
  Activity,
  FileText,
  Server
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-navy-900 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-500/30">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            <span>Super Administrator Control Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">System Infrastructure & Administration</h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
            Global access governance, role configurations, institutional security audit logs, and server diagnostics.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Badge variant="teal" size="md">Phase 1: Scaffolding Complete</Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget title="Institutional Users" value="9 Registered" subtitle="Across 6 ERP roles" icon={Users} color="navy" />
        <StatWidget title="Security Events" value="100% Validated" subtitle="Zero unauthorized breaches" icon={Lock} color="teal" />
        <StatWidget title="MongoDB Nodes" value="Active (Cluster)" subtitle="Automatic index sync" icon={Database} color="emerald" />
        <StatWidget title="Audit Trail" value="128 Actions" subtitle="Retention: 365 Days" icon={Activity} color="amber" />
      </div>

      {/* Scaffolding Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Administrative Module Scaffolding"
          subtitle="Sub-modules scheduled for Phase 2 implementation"
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {[
              { name: 'User Directory & Role Provisioning', path: '/users', status: 'Backend Routes Ready', desc: 'Create, update, and manage student, faculty, and administrative accounts.' },
              { name: 'Audit & Compliance Logs', path: '/audit-logs', status: 'Routes & Controller Ready', desc: 'Track privileged login attempts, marks changes, and financial modifications.' },
              { name: 'Database Backup & System Settings', path: '/settings', status: 'Scaffolded', desc: 'Manage institutional terms, academic calendar dates, and maintenance mode.' }
            ].map((mod, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-warm-50 border border-navy-100 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-navy-900">{mod.name}</h4>
                  <p className="text-xs text-navy-500 font-light mt-0.5">{mod.desc}</p>
                </div>
                <Badge variant="neutral" size="xs">{mod.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Administrative Actions" subtitle="Phase 1 shortcuts">
          <div className="space-y-2">
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/audit-logs')} icon={FileText}>
              Review Audit Trail
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/reports')} icon={Server}>
              System Health Reports
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/notices')} icon={Activity}>
              Broadcast System Circular
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

