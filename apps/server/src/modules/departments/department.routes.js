const express = require('express');
const { listDepartments, getDepartmentById, createDepartment } = require('./department.controller');
const { validateDepartmentInput } = require('./department.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Publicly readable for all authenticated institutional users
router.get('/', listDepartments);
router.get('/:id', getDepartmentById);

// Restricted creation to Super Admin and Principal
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  validateRequest(validateDepartmentInput),
  createDepartment
);

module.exports = router;

