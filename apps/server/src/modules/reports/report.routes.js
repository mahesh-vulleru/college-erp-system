const express = require('express');
const {
  getAcademicSummary,
  getAttendanceOverview,
  getFeeCollectionSummary,
  getAdminOverview,
  getDepartmentSummaries,
  getEnrollmentReport,
  getFacultyAllocationReport,
  getAttendanceReport,
  getExaminationsReport,
  getResultsSummaryReport,
  getFinancialReport,
  getAdminActivityReport,
  exportReportCsv
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

router.get(
  '/admin-overview',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  getAdminOverview
);

router.get(
  '/department-summaries',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getDepartmentSummaries
);

// Phase 3 Data-backed Institutional Reports
router.get(
  '/enrollment',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getEnrollmentReport
);

router.get(
  '/faculty-allocation',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getFacultyAllocationReport
);

router.get(
  '/attendance',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getAttendanceReport
);

router.get(
  '/examinations',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getExaminationsReport
);

router.get(
  '/results',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getResultsSummaryReport
);

router.get(
  '/financial',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  getFinancialReport
);

router.get(
  '/admin-activity',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  getAdminActivityReport
);

router.get(
  '/export',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS),
  exportReportCsv
);

module.exports = router;
