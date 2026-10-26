const express = require('express');
const { listUsers, getUserById, updateUserStatus } = require('./users.controller');
const { validateUserStatusInput } = require('./users.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Restricted to Super Admin, Principal, and HOD for viewing users
router.get('/', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS), listUsers);
router.get('/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS), getUserById);

// Restricted to Super Admin for status updates
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.SUPER_ADMIN),
  validateRequest(validateUserStatusInput),
  updateUserStatus
);

module.exports = router;

