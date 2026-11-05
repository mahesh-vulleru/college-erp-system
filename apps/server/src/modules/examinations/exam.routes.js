const express = require('express');
const {
  listExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getControllerStats,
  checkClashes,
  updateScheduleSlots,
  listRegistrations,
  registerStudent,
  evaluateEligibility,
  condoneShortage,
  generateHallTickets,
  getHallTickets,
  getHallTicketById,
  getExamAttendance,
  recordExamAttendance,
  getExamReports
} = require('./exam.controller');
const { validateExamInput } = require('./exam.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// 1. Examination Controller Dashboard Analytics & KPIs
router.get(
  '/controller/stats',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getControllerStats
);

// 2. Timetable Clash Detection
router.post(
  '/check-clash',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  checkClashes
);

// 3. Examination Reports & Analytics
router.get(
  '/reports/summary',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getExamReports
);

// 4. Registrations Management
router.get(
  '/registrations',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  listRegistrations
);

router.post(
  '/registrations',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.STUDENT),
  registerStudent
);

router.put(
  '/registrations/:id/condone',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  condoneShortage
);

// 5. Hall Tickets
router.get(
  '/hall-tickets',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getHallTickets
);

router.get(
  '/hall-tickets/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getHallTicketById
);

// 6. Examination Attendance
router.get(
  '/attendance',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getExamAttendance
);

router.post(
  '/attendance/batch',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  recordExamAttendance
);

// 7. Exam Specific Operations
router.put(
  '/:id/schedules',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  updateScheduleSlots
);

router.post(
  '/:id/evaluate-eligibility',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  evaluateEligibility
);

router.post(
  '/:id/generate-hall-tickets',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  generateHallTickets
);

// 8. Core Examination CRUD
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  listExams
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getExamById
);

router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateExamInput),
  createExam
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  updateExam
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  deleteExam
);

module.exports = router;
