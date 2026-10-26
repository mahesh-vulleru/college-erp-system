const express = require('express');
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword
} = require('./users.controller');
const {
  validateUserStatusInput,
  validateCreateUserInput,
  validateUpdateUserInput,
  validateResetPasswordInput
} = require('./users.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

// Enforce JWT authentication on all user-management endpoints
router.use(authenticate);

// Directory view permitted for administrative roles
router.get('/', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS), listUsers);
router.get('/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS), getUserById);

// Account creation strictly restricted to Super Admin
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN),
  validateRequest(validateCreateUserInput),
  createUser
);

// Account updates strictly restricted to Super Admin
router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN),
  validateRequest(validateUpdateUserInput),
  updateUser
);

// Account status updates (activate / disable) strictly restricted to Super Admin
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.SUPER_ADMIN),
  validateRequest(validateUserStatusInput),
  updateUserStatus
);

// Password reset strictly restricted to Super Admin
router.post(
  '/:id/reset-password',
  authorizeRoles(ROLES.SUPER_ADMIN),
  validateRequest(validateResetPasswordInput),
  resetUserPassword
);

module.exports = router;
