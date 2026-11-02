const express = require('express');
const { getResults, recordResult, batchRecordResults } = require('./result.controller');
const { validateResultInput } = require('./result.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

<<<<<<< HEAD
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getResults
);
=======
router.get('/', getResults);
>>>>>>> feature/library-staff-portal

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
