const express = require('express');
const {
  listCriteria,
  getCriteriaSummary,
  getCriterionById,
  createCriterion,
  updateCriterion,
  deleteCriterion,
  addEvidenceDocument,
  verifyEvidenceDocument
} = require('./accreditation.controller');
const {
  validateAccreditationCriterionInput,
  validateEvidenceVerificationInput
} = require('./accreditation.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// 1. High-level summary metrics
router.get(
  '/summary',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getCriteriaSummary
);

// 2. Criteria list with filters & search
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  listCriteria
);

// 3. Single criterion details
router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getCriterionById
);

// 4. Create criterion (Principal, Super Admin, HOD)
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateAccreditationCriterionInput),
  createCriterion
);

// 5. Update criterion
router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  updateCriterion
);

// 6. Delete criterion (Principal, Super Admin)
router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  deleteCriterion
);

// 7. Attach supporting evidence document
router.post(
  '/:id/evidence',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  addEvidenceDocument
);

// 8. Verify or reject evidence document (Principal, Super Admin, HOD)
router.patch(
  '/:id/evidence/:docId/verify',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateEvidenceVerificationInput),
  verifyEvidenceDocument
);

module.exports = router;

