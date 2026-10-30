const express = require('express');
const {
  listStudents,
  getStudentById,
  getMyStudentProfile,
  createStudentProfile,
  updateStudentProfile,
  getAtRiskStudents,
  getStudentRiskDetails
} = require('./student.controller');
const { validateStudentProfileInput } = require('./student.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Student self-profile endpoint
router.get('/me', authorizeRoles(ROLES.STUDENT), getMyStudentProfile);

// Institutional student registry access
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.ACCOUNTS),
  listStudents
);

// At-Risk Student Identification & Alerts (Principal, Super Admin, HOD)
router.get(
  '/at-risk',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getAtRiskStudents
);

router.get(
  '/:id/risk-details',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getStudentRiskDetails
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.ACCOUNTS),
  getStudentById
);

router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateStudentProfileInput),
  createStudentProfile
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  updateStudentProfile
);

module.exports = router;
