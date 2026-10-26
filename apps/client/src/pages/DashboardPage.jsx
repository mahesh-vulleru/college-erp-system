import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CalendarCheck,
  CreditCard,
  ShieldAlert,
  Building2,
  Activity,
  CheckCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatWidget from '../components/common/StatWidget';
import api from '../api/apiClient';

export const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState('');

  const fetchHealth = async () => {
    setIsHealthLoading(true);
    setHealthError('');
    try {
      const data = await api.checkHealth();
      setHealthData(data);
    } catch (err) {
      setHealthError(err.message || 'Failed to connect to backend server');
      setHealthData(null);
    } finally {
      setIsHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Team module allocation overview
  const teamModules = [
    {
      module: 'M1: Architecture, Core Auth & DevOps',
      owner: 'M1 (Tech Lead)',
      branch: 'feature/m1-auth-contracts',
      status: 'Scaffolding & Auth Validated',
      tech: 'Express, JWT, RBAC, CI/CD'
    },
    {
      module: 'M2: Academic Backend & Models',
      owner: 'M2 (Academic Backend)',
      branch: 'feature/m2-academics-mongo',
      status: 'Models & Scaffolding Ready',
      tech: 'Departments, Courses, Subjects, Attendance'
    },
    {
      module: 'M3: React Dashboards & UI Atoms',
      owner: 'M3 (Frontend Lead)',
      branch: 'feature/m3-react-dashboards',
      status: 'Architecture & UI Kit Complete',
      tech: 'React 18, Tailwind, Responsive Mobile'
    },
    {
      module: 'M4: Fees, Payments & Integration Testing',
      owner: 'M4 (Finance & QA)',
      branch: 'feature/m4-fees-testing',
      status: 'Contracts & Test Suite Ready',
      tech: 'Fee Structures, Ledger, Jest Supertest'
    }
  ];

  const columns = [
    { header: 'Module Scope', accessor: 'module', className: 'font-semibold text-navy-950' },
    { header: 'Assigned Member', accessor: 'owner' },
    {
      header: 'Feature Branch',
      accessor: (row) => (
        <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          {row.branch}
        </span>
      )
    },
    {
      header: 'Phase Status',
      accessor: (row) => (
        <Badge variant={row.status.includes('Validated') || row.status.includes('Complete') ? 'success' : 'teal'} size="xs">
          {row.status}
        </Badge>
      )
    },
    { header: 'Tech Stack', accessor: 'tech' }
  ];

  const rolePortals = [
    {
      title: 'Super Admin',
      role: 'super_admin',
      desc: 'System governance, user provisioning, security audit trail, and health diagnostics.',
      path: '/admin',
      icon: ShieldAlert,
      color: 'navy'
    },
    {
      title: 'Principal & Exec',
      role: 'principal',
      desc: 'Institutional analytics, department oversight, faculty loads, and academic decisions.',
      path: '/principal',
      icon: Building2,
      color: 'teal'
    },
    {
      title: 'Department Head (HOD)',
      role: 'hod',
      desc: 'Department curriculum, weekly timetable, attendance condonation, and marks moderation.',
      path: '/hod',
      icon: Users,
      color: 'emerald'
    },
    {
      title: 'Faculty Member',
      role: 'faculty',
      desc: 'Period attendance marking, internal test grades entry, and syllabus progression.',
      path: '/faculty',
      icon: CalendarCheck,
      color: 'amber'
    },
    {
      title: 'Student Portal',
      role: 'student',
      desc: 'Attendance percentage, timetable schedule, semester marks, and fee payment receipts.',
      path: '/student',
      icon: BookOpen,
      color: 'rose'
    },
    {
      title: 'Accounts & Finance',
      role: 'accounts',
      desc: 'Tuition fee structures, payment recording, student ledgers, and collection reports.',
      path: '/accounts',
      icon: CreditCard,
      color: 'teal'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-elevation relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-teal-500/30">
            <Layers className="w-3.5 h-3.5" />
            <span>Phase 1 Architecture Complete</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            {isAuthenticated ? `Welcome, ${user?.name}` : 'College ERP Foundation Hub'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-navy-200 leading-relaxed font-light">
            Engineered specifically for a single engineering college serving &lt;1,000 students across 6 departments. Cleanly unified between Express REST API, React Vite SPA, and shared role-based contracts.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {!isAuthenticated ? (
              <Button
                variant="teal"
                size="sm"
                onClick={() => navigate('/login')}
                icon={ArrowRight}
                iconPosition="right"
              >
                Sign In to Role Account
              </Button>
            ) : (
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700 text-xs font-medium">
                <span className="text-navy-300">Active Role:</span>
                <span className="font-bold uppercase tracking-wider text-teal-300">
                  {user?.role?.replace(/_/g, ' ')}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealth}
              className="border-navy-600 text-white hover:bg-navy-800/60"
              isLoading={isHealthLoading}
            >
              Test Backend Health
            </Button>
          </div>
        </div>
      </div>

      {/* Live System Health Status Card */}
      <Card
        title="Live System & Database Diagnostic"
        subtitle="Verifies real connection state to Express API and MongoDB instance"
        headerAction={
          <Button variant="ghost" size="xs" onClick={fetchHealth} isLoading={isHealthLoading}>
            Refresh State
          </Button>
        }
      >
        {healthError ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-semibold">Backend Unreachable</p>
              <p className="mt-0.5">{healthError}</p>
              <p className="mt-2 text-xs text-rose-700 font-mono">
                Start backend: <code>npm run dev:server</code>
              </p>
            </div>
          </div>
        ) : healthData ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-warm-50 border border-navy-100">
              <span className="text-navy-400 uppercase font-bold text-[10px] block">API Service</span>
              <span className="text-sm font-bold text-navy-900 flex items-center mt-1">
                <CheckCircle className="w-4 h-4 text-teal-600 mr-1.5" />
                {healthData.status}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-warm-50 border border-navy-100">
              <span className="text-navy-400 uppercase font-bold text-[10px] block">Database Status</span>
              <span className="text-sm font-bold text-navy-900 flex items-center mt-1">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  healthData.database?.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                {healthData.database?.status || 'disconnected'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-warm-50 border border-navy-100">
              <span className="text-navy-400 uppercase font-bold text-[10px] block">Uptime</span>
              <span className="text-sm font-bold text-navy-900 mt-1 block font-mono">
                {healthData.uptime}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-warm-50 border border-navy-100">
              <span className="text-navy-400 uppercase font-bold text-[10px] block">Environment</span>
              <span className="text-sm font-bold text-navy-900 mt-1 block uppercase">
                {healthData.environment}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-navy-400">Checking health status...</p>
        )}
      </Card>

      {/* Institutional Role Portals Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-navy-950">Role-Based Dashboard Portals</h2>
          <span className="text-xs text-navy-500">6 Protected Institutional Portals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolePortals.map((portal, idx) => {
            const Icon = portal.icon;
            const isUserRole = user?.role === portal.role || user?.role === 'super_admin';

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-navy-200/80 p-5 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-teal-700 border border-navy-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    {isUserRole && (
                      <Badge variant="teal" size="xs">Permitted</Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-navy-950">{portal.title}</h3>
                  <p className="mt-1 text-xs text-navy-600 font-light leading-relaxed">{portal.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-navy-400">{portal.path}</span>
                  <Link
                    to={portal.path}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center"
                  >
                    <span>Launch Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Workflow & Feature Branches Table */}
      <Card
        title="4-Developer Team Git Workflow & Feature Allocation"
        subtitle="Pre-allocated boundaries to prevent merge conflicts during Phase 2 development"
      >
        <Table columns={columns} data={teamModules} keyField="module" />
      </Card>
    </div>
  );
};

export default DashboardPage;
