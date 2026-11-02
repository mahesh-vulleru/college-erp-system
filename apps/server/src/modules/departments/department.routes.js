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
<<<<<<< HEAD
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
=======
router.get('/', listDepartments);
router.get('/:id', getDepartmentById);
>>>>>>> feature/library-staff-portal

// Restricted creation & modification to Super Admin and Principal
router.post(
  '/',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
>>>>>>> feature/library-staff-portal
  validateRequest(validateDepartmentInput),
  createDepartment
);

router.put(
  '/:id',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
>>>>>>> feature/library-staff-portal
  updateDepartment
);

module.exports = router;
