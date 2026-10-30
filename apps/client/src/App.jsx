import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/routing/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

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
import UserManagementPage from './pages/admin/UserManagementPage';
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

// Phase 1 Institutional Management Pages
import AccreditationCompliancePage from './pages/principal/AccreditationCompliancePage';
import InstitutionalGoalsPage from './pages/principal/InstitutionalGoalsPage';
import DeadlineEventTrackerPage from './pages/principal/DeadlineEventTrackerPage';

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

  const role = (user.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  switch (role) {
    case 'super_admin':
    case 'superadmin':
    case 'super_administrator':
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'principal':
      return <Navigate to="/principal" replace />;
    case 'hod':
      return <Navigate to="/hod" replace />;
    case 'faculty':
      return <Navigate to="/faculty" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    case 'accounts':
    case 'accountant':
    case 'finance':
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
          <ErrorBoundary>
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

            {/* Admin Dashboard URL Aliases */}
            <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/admindashboard" element={<Navigate to="/admin" replace />} />

            {/* HOD Dashboard URL Aliases */}
            <Route path="/hod-dashboard" element={<Navigate to="/hod" replace />} />
            <Route path="/hoddashboard" element={<Navigate to="/hod" replace />} />

            {/* 3. Protected Institutional Portals & Subsystems inside AppLayout */}
            <Route element={<AppLayout />}>
              {/* Optional System Diagnostics & Team Allocation Hub */}
              <Route
                path="overview"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, 'admin']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Role Dashboards */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, 'admin', 'superadmin', 'super_administrator']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="admin/dashboard" element={<Navigate to="/admin" replace />} />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, 'admin', 'superadmin', 'super_administrator']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route path="dashboard/admin" element={<Navigate to="/admin" replace />} />

              <Route
                path="principal"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, 'admin']}>
                    <PrincipalDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="principal/accreditation"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, 'admin']}>
                    <AccreditationCompliancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="principal/goals"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, 'admin']}>
                    <InstitutionalGoalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="principal/events"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, 'admin']}>
                    <DeadlineEventTrackerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hod"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, 'admin']}>
                    <HodDashboard />
                  </ProtectedRoute>
                }
              />
              {/* HOD Direct Sub-Routes & Aliases */}
              <Route path="hod/dashboard" element={<Navigate to="/hod" replace />} />
              <Route path="hod/faculty" element={<Navigate to="/faculty" replace />} />
              <Route path="hod/syllabus" element={<Navigate to="/courses" replace />} />
              <Route path="hod/courses" element={<Navigate to="/courses" replace />} />
              <Route path="hod/timetable" element={<Navigate to="/timetable" replace />} />
              <Route path="hod/students" element={<Navigate to="/students" replace />} />
              <Route path="hod/exams" element={<Navigate to="/examinations" replace />} />
              <Route path="hod/alerts" element={<Navigate to="/hod?tab=alerts" replace />} />
              <Route path="hod/attendance" element={<Navigate to="/attendance" replace />} />
              <Route path="hod/examinations" element={<Navigate to="/examinations" replace />} />
              <Route path="hod/results" element={<Navigate to="/results" replace />} />
              <Route path="hod/reports" element={<Navigate to="/reports" replace />} />
              <Route path="hod/notices" element={<Navigate to="/notices" replace />} />
              <Route
                path="faculty"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, 'admin']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="student"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="accounts"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, 'admin']}>
                    <AccountsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Phase 2: Six Fully Integrated Academic Subsystems */}
              <Route
                path="departments"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <DepartmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="courses"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <CoursesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="subjects"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <CoursesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="timetable"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <TimetablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <AttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <ExaminationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="results"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <ResultsPage />
                  </ProtectedRoute>
                }
              />

              {/* Phase 3 Institutional Administration Subsystems */}
              <Route
                path="fees"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT, 'admin']}>
                    <FeeManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payments"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT, 'admin']}>
                    <FeeManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notices"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.ACCOUNTS, 'admin']}>
                    <NoticeBoardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS, 'admin']}>
                    <ExecutiveReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS, 'admin']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all 404 inside layout */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
