const express = require('express');
const {
  listTemplates,
  getTemplateById,
  createTemplate,
  sendBroadcast,
  listLogs
} = require('./communication.controller');
const {
  validateTemplateInput,
  validateBroadcastInput
} = require('./communication.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Templates
router.get(
  '/templates',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS),
  listTemplates
);

router.get(
  '/templates/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS),
  getTemplateById
);

router.post(
  '/templates',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  validateRequest(validateTemplateInput),
  createTemplate
);

// Broadcast Dispatch
router.post(
  '/broadcast',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS),
  validateRequest(validateBroadcastInput),
  sendBroadcast
);

// Dispatch Audit Logs
router.get(
  '/logs',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  listLogs
);

module.exports = router;

