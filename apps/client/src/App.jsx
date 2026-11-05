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
import LibrarianDashboard from './pages/library/LibrarianDashboard';
import LibraryStaffDashboard from './pages/library/LibraryStaffDashboard';
import TransportAdminDashboard from './pages/transport/TransportAdminDashboard';
import TransportSupervisorPage from './pages/transport/TransportSupervisorPage';
import BusDriverPage from './pages/transport/BusDriverPage';
import BusAttendantPage from './pages/transport/BusAttendantPage';
import ParentPortalPage from './pages/transport/ParentPortalPage';

// Phase 2 Academic Subsystems
import DepartmentsPage from './pages/academics/DepartmentsPage';
import CoursesPage from './pages/academics/CoursesPage';
import TimetablePage from './pages/academics/TimetablePage';
import AttendancePage from './pages/academics/AttendancePage';
import ExaminationsPage from './pages/academics/ExaminationsPage';
import ResultsPage from './pages/academics/ResultsPage';

// Dedicated Examination Controller Dashboard & Operations
import ExaminationControllerDashboard from './pages/examinations/ExaminationControllerDashboard';
import ExaminationCalendarPage from './pages/examinations/ExaminationCalendarPage';
import ExaminationSchedulingPage from './pages/examinations/ExaminationSchedulingPage';
import ExamRegistrationsPage from './pages/examinations/ExamRegistrationsPage';
import StudentEligibilityPage from './pages/examinations/StudentEligibilityPage';
import HallTicketManagementPage from './pages/examinations/HallTicketManagementPage';
import ExamAttendancePage from './pages/examinations/ExamAttendancePage';
import MarksEntryPage from './pages/examinations/MarksEntryPage';
import MarksVerificationPage from './pages/examinations/MarksVerificationPage';
import ResultsProcessingPage from './pages/examinations/ResultsProcessingPage';
import ResultsManagementPage from './pages/examinations/ResultsManagementPage';
import ExaminationReportsPage from './pages/examinations/ExaminationReportsPage';

// Phase 3 Institutional Administration Pages
import FeeManagementPage from './pages/fees/FeeManagementPage';
import NoticeBoardPage from './pages/notices/NoticeBoardPage';
import ExecutiveReportsPage from './pages/reports/ExecutiveReportsPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';

// Phase 1 Institutional Management Pages
import AccreditationCompliancePage from './pages/principal/AccreditationCompliancePage';
import InstitutionalGoalsPage from './pages/principal/InstitutionalGoalsPage';
import DeadlineEventTrackerPage from './pages/principal/DeadlineEventTrackerPage';

// Campus Life & Operations Modules
import TransportPage from './pages/modules/TransportPage';
import HostelPage from './pages/modules/HostelPage';
import PlacementsPage from './pages/modules/PlacementsPage';
import AssetManagementPage from './pages/assets/AssetManagementPage';
import SettingsPage from './pages/modules/SettingsPage';

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
    case 'library_staff':
    case 'librarystaff':
      return <Navigate to="/library-staff" replace />;
    case 'transport_admin':
    case 'transportadmin':
      return <Navigate to="/transport/admin" replace />;
    case 'transport_supervisor':
      return <Navigate to="/transport/supervisor" replace />;
    case 'bus_driver':
      return <Navigate to="/transport/driver" replace />;
    case 'bus_attendant':
      return <Navigate to="/transport/attendant" replace />;
    case 'parent':
      return <Navigate to="/transport/parent" replace />;
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
            <Route path="/library-staff-dashboard" element={<Navigate to="/library-staff" replace />} />
            <Route path="/librarystaff" element={<Navigate to="/library-staff" replace />} />

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
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.ACCOUNTS, 'admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.ACCOUNTS, 'admin']}>
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
              <Route path="library/dashboard" element={<Navigate to="/library" replace />} />
              <Route
                path="library"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <LibrarianDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="library/*"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <LibrarianDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="library-staff/dashboard" element={<Navigate to="/library-staff" replace />} />
              <Route
                path="library-staff"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, 'admin']}>
                    <LibraryStaffDashboard />
                  </ProtectedRoute>
                }
              />
              {/* Transport Admin Dedicated Portal */}
              <Route
                path="transport/admin"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, 'admin']}>
                    <TransportAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="transport/admin/*"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, 'admin']}>
                    <TransportAdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Transport Supervisor Dedicated Portal */}
              <Route
                path="transport/supervisor"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.TRANSPORT_SUPERVISOR, 'admin']}>
                    <TransportSupervisorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="transport/supervisor/*"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.TRANSPORT_SUPERVISOR, 'admin']}>
                    <TransportSupervisorPage />
                  </ProtectedRoute>
                }
              />

              {/* Bus Driver Dedicated Portal */}
              <Route
                path="transport/driver"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.BUS_DRIVER, 'admin']}>
                    <BusDriverPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="transport/driver/*"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.BUS_DRIVER, 'admin']}>
                    <BusDriverPage />
                  </ProtectedRoute>
                }
              />

              {/* Bus Attendant Dedicated Portal */}
              <Route
                path="transport/attendant"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.BUS_ATTENDANT, 'admin']}>
                    <BusAttendantPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="transport/attendant/*"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.BUS_ATTENDANT, 'admin']}>
                    <BusAttendantPage />
                  </ProtectedRoute>
                }
              />

              {/* Parent Dedicated Portal */}
              <Route
                path="transport/parent"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.PARENT, 'admin']}>
                    <ParentPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="transport/parent/*"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.PARENT, 'admin']}>
                    <ParentPortalPage />
                  </ProtectedRoute>
                }
              />

              {/* General Transport Aliases & Fallbacks */}
              <Route
                path="transport"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.ACCOUNTS,
                      ROLES.TRANSPORT_ADMIN,
                      ROLES.TRANSPORT_SUPERVISOR,
                      ROLES.BUS_DRIVER,
                      ROLES.BUS_ATTENDANT,
                      ROLES.PARENT,
                      'admin'
                    ]}
                  >
                    <TransportAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="transport/dashboard" element={<Navigate to="/transport/admin" replace />} />
              <Route path="transport-supervisor" element={<Navigate to="/transport/supervisor" replace />} />
              <Route path="transport-driver" element={<Navigate to="/transport/driver" replace />} />
              <Route path="transport-parent" element={<Navigate to="/transport/parent" replace />} />
              <Route path="super-admin" element={<Navigate to="/admin" replace />} />
              <Route path="super-admin/*" element={<Navigate to="/admin" replace />} />
              <Route
                path="transport/*"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.ACCOUNTS,
                      ROLES.TRANSPORT_ADMIN,
                      ROLES.TRANSPORT_SUPERVISOR,
                      ROLES.BUS_DRIVER,
                      ROLES.BUS_ATTENDANT,
                      ROLES.PARENT,
                      'admin'
                    ]}
                  >
                    <TransportAdminDashboard />
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
                path="calendar"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.ACCOUNTS, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, ROLES.TRANSPORT_ADMIN, ROLES.TRANSPORT_SUPERVISOR, ROLES.BUS_DRIVER, ROLES.BUS_ATTENDANT, ROLES.PARENT, 'admin']}>
                    <DeadlineEventTrackerPage />
                  </ProtectedRoute>
                }
              />
              <Route path="events" element={<Navigate to="/calendar" replace />} />
              <Route path="academic-calendar" element={<Navigate to="/calendar" replace />} />
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

              {/* Dedicated Examination Controller Dashboard & Operations */}
              <Route
                path="examinations/controller"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, 'admin']}>
                    <ExaminationControllerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/calendar"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <ExaminationCalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/scheduling"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, 'admin']}>
                    <ExaminationSchedulingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/registrations"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <ExamRegistrationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/eligibility"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, 'admin']}>
                    <StudentEligibilityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/hall-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <HallTicketManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/attendance"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, 'admin']}>
                    <ExamAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/marks-entry"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, 'admin']}>
                    <MarksEntryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/marks-verification"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, 'admin']}>
                    <MarksVerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/results-processing"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, 'admin']}>
                    <ResultsProcessingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/results"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, 'admin']}>
                    <ResultsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="examinations/reports"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, 'admin']}>
                    <ExaminationReportsPage />
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
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SUPER_ADMIN,
                      ROLES.PRINCIPAL,
                      ROLES.HOD,
                      ROLES.FACULTY,
                      ROLES.STUDENT,
                      ROLES.ACCOUNTS,
                      ROLES.LIBRARIAN,
                      ROLES.LIBRARY_STAFF,
                      ROLES.TRANSPORT_ADMIN,
                      ROLES.TRANSPORT_SUPERVISOR,
                      ROLES.BUS_DRIVER,
                      ROLES.BUS_ATTENDANT,
                      ROLES.PARENT,
                      'admin'
                    ]}
                  >
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

              {/* Campus Operations & Settings */}
              <Route path="transport" element={<TransportPage />} />
              <Route path="hostel" element={<HostelPage />} />
              <Route path="placements" element={<PlacementsPage />} />
              <Route
                path="assets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS, ROLES.LIBRARIAN, 'admin']}>
                    <AssetManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route path="settings" element={<SettingsPage />} />

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
