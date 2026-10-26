const express = require('express');
const { listFeeStructures, createFeeStructure } = require('./fee.controller');
const { validateFeeStructureInput } = require('./fee.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

router.get('/structures', listFeeStructures);

router.post(
  '/structures',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  validateRequest(validateFeeStructureInput),
  createFeeStructure
);

module.exports = router;

