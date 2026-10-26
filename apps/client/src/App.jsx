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

// Module Scaffolding Template
import ModulePlaceholderPage from './pages/modules/ModulePlaceholderPage';
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
                  <ProtectedRoute>
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

              {/* Modular Academic & Administrative Subsystems */}
              <Route
                path="departments"
                element={
                  <ProtectedRoute>
                    <ModulePlaceholderPage
                      title="Department Management"
                      description="Catalog of academic engineering departments, intake limits, assigned HODs, and faculty allotment."
                      apiEndpoint="/v1/departments"
                      assignedMember="M2 (Academic Backend)"
                      branchName="feature/m2-academics-mongo"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="courses"
                element={
                  <ProtectedRoute>
                    <ModulePlaceholderPage
                      title="Programs & Courses"
                      description="Undergraduate B.Tech degree programs, curriculum duration, total credits, and semester mappings."
                      apiEndpoint="/v1/courses"
                      assignedMember="M2 (Academic Backend)"
                      branchName="feature/m2-academics-mongo"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="subjects"
                element={
                  <ProtectedRoute>
                    <ModulePlaceholderPage
                      title="Curriculum Subjects"
                      description="Semester syllabus courses, theory lectures, laboratory practicals, and credit values."
                      apiEndpoint="/v1/subjects"
                      assignedMember="M2 (Academic Backend)"
                      branchName="feature/m2-academics-mongo"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="timetable"
                element={
                  <ProtectedRoute>
                    <ModulePlaceholderPage
                      title="Class Schedules & Timetable"
                      description="Weekly master schedule, room numbers, lecture slots, faculty clash detection, and period timings."
                      apiEndpoint="/v1/timetable"
                      assignedMember="M2 (Academic Backend)"
                      branchName="feature/m2-academics-mongo"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance"
                element={
                  <ProtectedRoute>
                    <ModulePlaceholderPage
                      title="Attendance Management"
                      description="Daily period attendance capture, percentage computation, and condonation monitoring."
                      apiEndpoint="/v1/attendance"
                      assignedMember="M2 (Academic Backend)"
                      branchName="feature/m2-academics-mongo"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations"
                element={
                  <ProtectedRoute>
                    <ModulePlaceholderPage
                      title="Examinations System"
                      description="Mid-term evaluations, semester-end exam slots, invigilation duty registers, and hall schedules."
                      apiEndpoint="/v1/examinations"
                      assignedMember="M2 (Academic Backend)"
                      branchName="feature/m2-academics-mongo"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="results"
                element={
                  <ProtectedRoute>
                    <ModulePlaceholderPage
                      title="Marks & Grade Evaluation"
                      description="Internal test marks entry, external exam scores, letter grades calculation, and semester GPA."
                      apiEndpoint="/v1/results"
                      assignedMember="M2 (Academic Backend)"
                      branchName="feature/m2-academics-mongo"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fees"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT]}>
                    <ModulePlaceholderPage
                      title="Institutional Fee Schedules"
                      description="Departmental tuition fee heads, lab fees, library fees, semester deadlines, and dues calculation."
                      apiEndpoint="/v1/fees/structures"
                      assignedMember="M4 (Finance & QA)"
                      branchName="feature/m4-fees-testing"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payments"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT]}>
                    <ModulePlaceholderPage
                      title="Payment Receipts & Reconciliation"
                      description="Fee transaction processing, official receipt numbers, collection ledgers, and accounts settlement."
                      apiEndpoint="/v1/payments"
                      assignedMember="M4 (Finance & QA)"
                      branchName="feature/m4-fees-testing"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notices"
                element={
                  <ProtectedRoute>
                    <ModulePlaceholderPage
                      title="Institutional Notices & Circulars"
                      description="Campus announcements, emergency notices, holiday schedules, and role-targeted circulars."
                      apiEndpoint="/v1/notices"
                      assignedMember="M1 (Architecture & Auth)"
                      branchName="feature/m1-auth-contracts"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS]}>
                    <ModulePlaceholderPage
                      title="Executive Reports & Analytics"
                      description="Aggregated institutional reports covering academic performance, student retention, and finances."
                      apiEndpoint="/v1/reports/academic-summary"
                      assignedMember="M1 (Architecture & Auth)"
                      branchName="feature/m1-auth-contracts"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL]}>
                    <ModulePlaceholderPage
                      title="Security Audit & Compliance"
                      description="Cryptographically recorded event log of administrative actions, user logins, and database mutations."
                      apiEndpoint="/v1/audit-logs"
                      assignedMember="M1 (Architecture & Auth)"
                      branchName="feature/m1-auth-contracts"
                    />
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
