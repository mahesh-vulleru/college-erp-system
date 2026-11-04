const express = require('express');
const { getSystemHealthMetrics } = require('./system.controller');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Strictly restricted to Super Admin
router.get(
  '/health-metrics',
  authorizeRoles(ROLES.SUPER_ADMIN),
  getSystemHealthMetrics
);

module.exports = router;

