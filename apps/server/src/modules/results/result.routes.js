const express = require('express');
const { getResults, recordResult } = require('./result.controller');
const { validateResultInput } = require('./result.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

router.get('/', getResults);

// Marks entry restricted to Faculty, HOD, and Principal
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  validateRequest(validateResultInput),
  recordResult
);

module.exports = router;

