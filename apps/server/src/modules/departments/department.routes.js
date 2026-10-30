const express = require('express');
const {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment
} = require('./department.controller');
const { validateDepartmentInput } = require('./department.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Publicly readable for all authenticated institutional users
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  listDepartments
);
router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getDepartmentById
);

// Restricted creation & modification to Super Admin and Principal
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN),
  validateRequest(validateDepartmentInput),
  createDepartment
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN),
  updateDepartment
);

module.exports = router;
