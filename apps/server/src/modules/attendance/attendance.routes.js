const express = require('express');
const {
  getAttendanceRecords,
  markAttendanceBatch,
  getAttendanceSummary
} = require('./attendance.controller');
const { getAttendanceOverview } = require('../reports/report.controller');
const { validateAttendanceBatchInput } = require('./attendance.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getAttendanceRecords
);
router.get(
  '/summary',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getAttendanceSummary
);
router.get(
  '/overview',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getAttendanceOverview
);

// Only faculty, HOD, and principal can mark attendance
router.post(
  '/mark',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  validateRequest(validateAttendanceBatchInput),
  markAttendanceBatch
);

router.post(
  '/batch',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  validateRequest(validateAttendanceBatchInput),
  markAttendanceBatch
);

module.exports = router;
