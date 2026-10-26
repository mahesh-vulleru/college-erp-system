const express = require('express');
const { listAuditLogs } = require('./audit.controller');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Audit logs are exclusively for Super Admin and Principal
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  listAuditLogs
);

module.exports = router;

