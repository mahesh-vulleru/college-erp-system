import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/routing/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorPage from './pages/ErrorPage';

// Internal Institutional Overview
import DashboardPage from './pages/DashboardPage';

// Role Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import PrincipalDashboard from './pages/principal/PrincipalDashboard';
import HodDashboard from './pages/hod/HodDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import AccountsDashboard from './pages/accounts/AccountsDashboard';

// Phase 2 Academic Subsystems
import DepartmentsPage from './pages/academics/DepartmentsPage';
import CoursesPage from './pages/academics/CoursesPage';
import TimetablePage from './pages/academics/TimetablePage';
import AttendancePage from './pages/academics/AttendancePage';
import ExaminationsPage from './pages/academics/ExaminationsPage';
import ResultsPage from './pages/academics/ResultsPage';

// Phase 3 Institutional Administration Pages
import FeeManagementPage from './pages/fees/FeeManagementPage';
import NoticeBoardPage from './pages/notices/NoticeBoardPage';
import ExecutiveReportsPage from './pages/reports/ExecutiveReportsPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';

import { ROLES } from '@college-erp/shared';

// Smart redirector for /dashboard based on authenticated role
const DashboardRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case ROLES.SUPER_ADMIN:
      return <Navigate to="/admin" replace />;
    case ROLES.PRINCIPAL:
      return <Navigate to="/principal" replace />;
    case ROLES.HOD:
      return <Navigate to="/hod" replace />;
    case ROLES.FACULTY:
      return <Navigate to="/faculty" replace />;
    case ROLES.STUDENT:
      return <Navigate to="/student" replace />;
    case ROLES.ACCOUNTS:
      return <Navigate to="/accounts" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

export const App = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* 1. Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* 2. Public Role-Based Login Gateway */}
            <Route path="/login" element={<LoginPage />} />

            {/* Public Utility Status Pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/error" element={<ErrorPage />} />

            {/* Dynamic Dashboard Route - redirects to authenticated user's role portal */}
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* 3. Protected Institutional Portals & Subsystems inside AppLayout */}
            <Route element={<AppLayout />}>
              {/* Optional System Diagnostics & Team Allocation Hub */}
              <Route
                path="overview"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL]}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Role Dashboards */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="principal"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL]}>
                    <PrincipalDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hod"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD]}>
                    <HodDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="faculty"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY]}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="student"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.STUDENT]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="accounts"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS]}>
                    <AccountsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Phase 2: Six Fully Integrated Academic Subsystems */}
              <Route
                path="departments"
                element={
                  <ProtectedRoute>
                    <DepartmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="courses"
                element={
                  <ProtectedRoute>
                    <CoursesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="subjects"
                element={
                  <ProtectedRoute>
                    <CoursesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="timetable"
                element={
                  <ProtectedRoute>
                    <TimetablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance"
                element={
                  <ProtectedRoute>
                    <AttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations"
                element={
                  <ProtectedRoute>
                    <ExaminationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="results"
                element={
                  <ProtectedRoute>
                    <ResultsPage />
                  </ProtectedRoute>
                }
              />

              {/* Phase 3 Institutional Administration Subsystems */}
              <Route
                path="fees"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT]}>
                    <FeeManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payments"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT]}>
                    <FeeManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notices"
                element={
                  <ProtectedRoute>
                    <NoticeBoardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS]}>
                    <ExecutiveReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL]}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all 404 inside layout */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
