const express = require('express');
const {
  getResults,
  recordResult,
  batchRecordResults,
  getAcademicInsights,
  verifyResult,
  batchVerifyResults,
  processResults,
  publishResults,
  unpublishResults
} = require('./result.controller');
const { validateResultInput } = require('./result.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Phase 3 Explainable Academic Risk & Pass Probability Intelligence
router.get(
  '/academic-insights',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.STUDENT
  ),
  getAcademicInsights
);

// Batch verify marks (Examination Controller / HOD / Principal)
router.post(
  '/batch-verify',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  batchVerifyResults
);

// Results processing - audit completeness and recalculate stats
router.post(
  '/process/:examinationId',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  processResults
);

// Publish results to student portal
router.post(
  '/publish/:examinationId',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  publishResults
);

// Rollback / unpublish results
router.post(
  '/unpublish/:examinationId',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  unpublishResults
);

router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getResults
);

// Single result verification sign-off or flagging
router.put(
  '/:id/verify',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  verifyResult
);

// Marks entry restricted to Faculty, HOD, and Principal
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  validateRequest(validateResultInput),
  recordResult
);

router.post(
  '/batch',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  batchRecordResults
);

module.exports = router;
