const express = require('express');
const { listAuditLogs, getAuditLogById, exportAuditLogsCsv } = require('./audit.controller');
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

router.get(
  '/export',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  exportAuditLogsCsv
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  getAuditLogById
);

module.exports = router;
