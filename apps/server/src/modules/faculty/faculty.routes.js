const express = require('express');
const {
  listFaculty,
  getFacultyById,
  getMyFacultyProfile,
  createFacultyProfile,
  updateFacultyProfile
} = require('./faculty.controller');
const {
  getFacultyWorkload,
  createSubstitution,
  listSubstitutions,
  reviewSubstitution
} = require('./workload.controller');
const { validateFacultyInput } = require('./faculty.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Faculty workload overview
router.get(
  '/workload',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getFacultyWorkload
);

// Faculty substitutions
router.get(
  '/substitutions',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  listSubstitutions
);

router.post(
  '/substitutions',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  createSubstitution
);

router.patch(
  '/substitutions/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  reviewSubstitution
);

router.get('/me', authorizeRoles(ROLES.FACULTY, ROLES.HOD), getMyFacultyProfile);

router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  listFaculty
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getFacultyById
);

router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateFacultyInput),
  createFacultyProfile
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  updateFacultyProfile
);

module.exports = router;
