import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  CalendarCheck,
  CreditCard,
  ShieldAlert,
  Activity,
  CheckCircle,
  AlertTriangle,
  GitPullRequest,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Notification from '../components/common/Notification';
import api from '../api/apiClient';

export const DashboardPage = ({ currentTab = 'dashboard', onNavigateLogin }) => {
  const { user, isAuthenticated } = useAuth();
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
      status: 'Foundation Complete',
      tech: 'Express, JWT, RBAC, CI/CD'
    },
    {
      module: 'M2: Academic Models & APIs',
      owner: 'M2 (Academic Backend)',
      branch: 'feature/m2-academics-mongo',
      status: 'Ready for Assignment',
      tech: 'Courses, Semesters, Attendance'
    },
    {
      module: 'M3: Reusable Dashboards & UI',
      owner: 'M3 (Frontend Lead)',
      branch: 'feature/m3-react-dashboards',
      status: 'Shell & Atoms Built',
      tech: 'React 18, Tailwind, Responsive Mobile'
    },
    {
      module: 'M4: Fees, Payments & Integration Testing',
      owner: 'M4 (Finance & QA)',
      branch: 'feature/m4-fees-testing',
      status: 'Ready for Assignment',
      tech: 'Fee Structures, Ledger, Jest'
    }
  ];

  const columns = [
    { header: 'Module Scope', accessor: 'module', className: 'font-semibold text-gray-900' },
    { header: 'Assigned Member', accessor: 'owner' },
    {
      header: 'Feature Branch',
      accessor: (row) => (
        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {row.branch}
        </span>
      )
    },
    {
      header: 'Phase Status',
      accessor: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          row.status.includes('Complete') || row.status.includes('Built')
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Tech Stack', accessor: 'tech' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome / Auth Alert banner */}
      {!isAuthenticated && (
        <Notification
          type="info"
          title="Guest Mode Notice"
          message="You are exploring the ERP Foundation shell. To test role-based authentication and protected endpoints, log in using registered institutional credentials."
        />
      )}

      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Monorepo Foundation Ready</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            {isAuthenticated ? `Welcome, ${user?.name}` : 'College ERP Foundation Hub'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed font-light">
            Architectural base for a single engineering college serving &lt;1,000 students. Cleanly isolated between Express backend, React Vite client, and shared role definitions.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {!isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateLogin}
                className="bg-white text-blue-700 hover:bg-blue-50 shadow-sm"
              >
                Sign In to College Account
              </Button>
            ) : (
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-black/20 text-xs font-medium">
                <span>Active Role:</span>
                <span className="font-bold uppercase tracking-wider text-amber-300">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealth}
              className="border-white/40 text-white hover:bg-white/10"
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
          <Button variant="ghost" size="sm" onClick={fetchHealth} isLoading={isHealthLoading}>
            Refresh State
          </Button>
        }
      >
        {healthError ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start space-x-3 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-semibold">Backend Unreachable</p>
              <p className="mt-0.5">{healthError}</p>
              <p className="mt-2 text-xs text-red-600 font-mono">
                Ensure backend is started: <code>npm run dev:server</code>
              </p>
            </div>
          </div>
        ) : healthData ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 uppercase font-bold text-[10px] block">API Service</span>
              <span className="text-sm font-bold text-gray-900 flex items-center mt-1">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" />
                {healthData.status}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 uppercase font-bold text-[10px] block">Database Status</span>
              <span className="text-sm font-bold text-gray-900 flex items-center mt-1">
                <span className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  healthData.database?.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                {healthData.database?.status || 'disconnected'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 uppercase font-bold text-[10px] block">Uptime</span>
              <span className="text-sm font-bold text-gray-900 mt-1 block font-mono">
                {healthData.uptime}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 uppercase font-bold text-[10px] block">Environment</span>
              <span className="text-sm font-bold text-gray-900 mt-1 block uppercase">
                {healthData.environment}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Checking health status...</p>
        )}
      </Card>

      {/* Role Permission Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Super Admin',
            desc: 'Full institutional configuration, user management, and security audit logs.',
            icon: ShieldAlert,
            color: 'text-purple-600 bg-purple-50'
          },
          {
            title: 'Principal / HOD',
            desc: 'Academic oversight, department courses, faculty allotment, and attendance tracking.',
            icon: BookOpen,
            color: 'text-blue-600 bg-blue-50'
          },
          {
            title: 'Faculty Member',
            desc: 'Period attendance marking, internal test marks entry, and student mentoring.',
            icon: CalendarCheck,
            color: 'text-emerald-600 bg-emerald-50'
          },
          {
            title: 'Student & Accounts',
            desc: 'Self-service fee ledger, attendance percentage viewing, and semester grade cards.',
            icon: CreditCard,
            color: 'text-amber-600 bg-amber-50'
          }
        ].map((roleCard, idx) => {
          const Icon = roleCard.icon;
          return (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roleCard.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-gray-900">{roleCard.title}</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-light">{roleCard.desc}</p>
            </Card>
          );
        })}
      </div>

      {/* Team Workflow & Feature Branches Table */}
      <Card
        title="4-Developer Git Workflow & Feature Allocation"
        subtitle="Mandatory branch naming conventions and clean separation of concerns"
      >
        <Table columns={columns} data={teamModules} keyField="module" />
      </Card>
    </div>
  );
};

export default DashboardPage;
