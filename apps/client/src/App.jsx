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
<<<<<<< HEAD
import UserManagementPage from './pages/admin/UserManagementPage';
=======
>>>>>>> feature/library-staff-portal
import PrincipalDashboard from './pages/principal/PrincipalDashboard';
import HodDashboard from './pages/hod/HodDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import AccountsDashboard from './pages/accounts/AccountsDashboard';
import LibrarianDashboard from './pages/library/LibrarianDashboard';
<<<<<<< HEAD
=======
import LibraryStaffDashboard from './pages/library/LibraryStaffDashboard';
>>>>>>> feature/library-staff-portal

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
    case 'librarian':
      return <Navigate to="/library" replace />;
<<<<<<< HEAD
=======
    case 'library_staff':
    case 'librarystaff':
      return <Navigate to="/library-staff" replace />;
>>>>>>> feature/library-staff-portal
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

            {/* Library Dashboard URL Aliases */}
            <Route path="/library-dashboard" element={<Navigate to="/library" replace />} />
            <Route path="/librarydashboard" element={<Navigate to="/library" replace />} />
<<<<<<< HEAD
=======
            <Route path="/library-staff-dashboard" element={<Navigate to="/library-staff" replace />} />
            <Route path="/librarystaff" element={<Navigate to="/library-staff" replace />} />
>>>>>>> feature/library-staff-portal

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
<<<<<<< HEAD
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, 'admin', 'superadmin', 'super_administrator']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
=======
>>>>>>> feature/library-staff-portal
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
<<<<<<< HEAD
              <Route path="hod/faculty" element={<Navigate to="/faculty" replace />} />
              <Route path="hod/syllabus" element={<Navigate to="/courses" replace />} />
              <Route path="hod/courses" element={<Navigate to="/courses" replace />} />
              <Route path="hod/timetable" element={<Navigate to="/timetable" replace />} />
              <Route path="hod/students" element={<Navigate to="/students" replace />} />
              <Route path="hod/exams" element={<Navigate to="/examinations" replace />} />
=======
              <Route path="hod/faculty" element={<Navigate to="/hod?tab=faculty" replace />} />
              <Route path="hod/syllabus" element={<Navigate to="/hod?tab=syllabus" replace />} />
              <Route path="hod/courses" element={<Navigate to="/hod?tab=syllabus" replace />} />
              <Route path="hod/timetable" element={<Navigate to="/hod?tab=timetable" replace />} />
              <Route path="hod/students" element={<Navigate to="/hod?tab=students" replace />} />
              <Route path="hod/exams" element={<Navigate to="/hod?tab=exams" replace />} />
>>>>>>> feature/library-staff-portal
              <Route path="hod/alerts" element={<Navigate to="/hod?tab=alerts" replace />} />
              <Route path="hod/attendance" element={<Navigate to="/attendance" replace />} />
              <Route path="hod/examinations" element={<Navigate to="/examinations" replace />} />
              <Route path="hod/results" element={<Navigate to="/results" replace />} />
              <Route path="hod/reports" element={<Navigate to="/reports" replace />} />
              <Route path="hod/notices" element={<Navigate to="/notices" replace />} />
              <Route
                path="faculty"
                element={
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, 'admin']}>
=======
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.FACULTY, 'admin']}>
>>>>>>> feature/library-staff-portal
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="student"
                element={
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
=======
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.STUDENT, 'admin']}>
>>>>>>> feature/library-staff-portal
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
<<<<<<< HEAD
=======
              <Route path="library/dashboard" element={<Navigate to="/library" replace />} />
>>>>>>> feature/library-staff-portal
              <Route
                path="library"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, 'admin']}>
                    <LibrarianDashboard />
                  </ProtectedRoute>
                }
              />
<<<<<<< HEAD
              <Route path="library/dashboard" element={<Navigate to="/library" replace />} />
=======
>>>>>>> feature/library-staff-portal
              <Route
                path="library/*"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, 'admin']}>
                    <LibrarianDashboard />
                  </ProtectedRoute>
                }
              />
<<<<<<< HEAD
=======
              <Route path="library-staff/dashboard" element={<Navigate to="/library-staff" replace />} />
              <Route
                path="library-staff"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, 'admin']}>
                    <LibraryStaffDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="library-staff/*"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, 'admin']}>
                    <LibraryStaffDashboard />
                  </ProtectedRoute>
                }
              />
>>>>>>> feature/library-staff-portal

              {/* Phase 2: Six Fully Integrated Academic Subsystems */}
              <Route
                path="departments"
                element={
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
=======
                  <ProtectedRoute>
>>>>>>> feature/library-staff-portal
                    <DepartmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="courses"
                element={
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
=======
                  <ProtectedRoute>
>>>>>>> feature/library-staff-portal
                    <CoursesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="subjects"
                element={
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
=======
                  <ProtectedRoute>
>>>>>>> feature/library-staff-portal
                    <CoursesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="timetable"
                element={
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
=======
                  <ProtectedRoute>
>>>>>>> feature/library-staff-portal
                    <TimetablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance"
                element={
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
=======
                  <ProtectedRoute>
>>>>>>> feature/library-staff-portal
                    <AttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations"
                element={
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
=======
                  <ProtectedRoute>
>>>>>>> feature/library-staff-portal
                    <ExaminationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="results"
                element={
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
=======
                  <ProtectedRoute>
>>>>>>> feature/library-staff-portal
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
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.ACCOUNTS, 'admin']}>
=======
                  <ProtectedRoute>
>>>>>>> feature/library-staff-portal
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
<<<<<<< HEAD
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS, 'admin']}>
=======
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, 'admin']}>
>>>>>>> feature/library-staff-portal
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
