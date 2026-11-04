const express = require('express');

const healthRoutes = require('./health.routes');
const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const departmentRoutes = require('../modules/departments/department.routes');
const courseRoutes = require('../modules/courses/course.routes');
const subjectRoutes = require('../modules/subjects/subject.routes');
const studentRoutes = require('../modules/students/student.routes');
const parentLinkRoutes = require('../modules/students/parentLink.routes');
const facultyRoutes = require('../modules/faculty/faculty.routes');
const timetableRoutes = require('../modules/timetable/timetable.routes');
const attendanceRoutes = require('../modules/attendance/attendance.routes');
const examRoutes = require('../modules/examinations/exam.routes');
const resultRoutes = require('../modules/results/result.routes');
const feeRoutes = require('../modules/fees/fee.routes');
const paymentRoutes = require('../modules/payments/payment.routes');
const noticeRoutes = require('../modules/notices/notice.routes');
const reportRoutes = require('../modules/reports/report.routes');
const auditRoutes = require('../modules/audit-logs/audit.routes');
const leaveRoutes = require('../modules/leave/leave.routes');
const accreditationRoutes = require('../modules/accreditation/accreditation.routes');
const goalRoutes = require('../modules/goals/goal.routes');
const eventRoutes = require('../modules/events/institutionalEvent.routes');
const libraryRoutes = require('../modules/library/library.routes');
const transportRoutes = require('../modules/transport/transport.routes');
const notificationRoutes = require('../modules/notifications/notification.routes');
const helpdeskRoutes = require('../modules/helpdesk/ticket.routes');
const documentRoutes = require('../modules/documents/document.routes');

const {
  getAttendanceOverview,
  getDepartmentSummaries,
  getExaminationsReport
} = require('../modules/reports/report.controller');

const authenticate = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

// Health Check
router.use('/health', healthRoutes);

// Versioned API v1 Router
const v1Router = express.Router();

// Health
v1Router.use('/health', healthRoutes);

// Authentication and Users
v1Router.use('/auth', authRoutes);
v1Router.use('/users', usersRoutes);

// Departments
v1Router.get(
  '/department-summaries',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getDepartmentSummaries
);
v1Router.use('/departments', departmentRoutes);

// Academic Modules
v1Router.use('/courses', courseRoutes);
v1Router.use('/subjects', subjectRoutes);
v1Router.use('/students', studentRoutes);

// Parent Linkage (Phase 2 Module 12)
v1Router.use('/parent-links', parentLinkRoutes);
v1Router.use('/parent', parentLinkRoutes);

v1Router.use('/faculty', facultyRoutes);
v1Router.use('/timetable', timetableRoutes);
v1Router.use('/attendance', attendanceRoutes);

// Attendance Analytics Overview
v1Router.get(
  '/attendance-overview',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getAttendanceOverview
);

// Examination Analytics Overview
v1Router.get(
  '/examinations-report',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getExaminationsReport
);

v1Router.use('/examinations', examRoutes);
v1Router.use('/results', resultRoutes);

// Fees and Payments
v1Router.use('/fees', feeRoutes);
v1Router.use('/payments', paymentRoutes);

// Reports and Administration
v1Router.use('/notices', noticeRoutes);
v1Router.use('/reports', reportRoutes);
v1Router.use('/audit-logs', auditRoutes);
v1Router.use('/leaves', leaveRoutes);

// Institutional Modules
v1Router.use('/accreditation', accreditationRoutes);
v1Router.use('/institutional-goals', goalRoutes);
v1Router.use('/institutional-events', eventRoutes);
v1Router.use('/events', eventRoutes.calendarRouter || eventRoutes);
v1Router.use('/calendar', eventRoutes.calendarRouter || eventRoutes);

// Notifications System
v1Router.use('/notifications', notificationRoutes);

// Helpdesk & Grievances (Phase 2 Module 3)
v1Router.use('/helpdesk', helpdeskRoutes);
v1Router.use('/grievances', helpdeskRoutes);

// Documents Management (Phase 2 Module 11)
v1Router.use('/documents', documentRoutes);

// Library
v1Router.use('/library', libraryRoutes);

// Transport Management
v1Router.use('/transport', transportRoutes);

// Mount versioned API
router.use('/v1', v1Router);

// Direct Aliases
router.use('/library', libraryRoutes);
router.use('/transport', transportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/calendar', eventRoutes.calendarRouter || eventRoutes);
router.use('/helpdesk', helpdeskRoutes);
router.use('/documents', documentRoutes);
router.use('/parent-links', parentLinkRoutes);
router.use('/parent', parentLinkRoutes);

module.exports = router;
