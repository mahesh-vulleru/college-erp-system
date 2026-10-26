const express = require('express');
const {
  getAcademicSummary,
  getAttendanceOverview,
  getFeeCollectionSummary
} = require('./report.controller');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Restricted executive summary reports
router.get(
  '/academic-summary',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getAcademicSummary
);

router.get(
  '/attendance-overview',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getAttendanceOverview
);

router.get(
  '/fee-collection',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  getFeeCollectionSummary
);

module.exports = router;

