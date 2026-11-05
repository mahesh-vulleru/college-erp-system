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
const { getStudent360 } = require('./student360.controller');
const {
  listMyChildren,
  createParentLink,
  listParentLinks,
  updateParentLink,
  deleteParentLink
} = require('./parentLink.controller');
const { validateStudentProfileInput } = require('./student.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Student 360° Profile for authenticated student
router.get('/me/360', authorizeRoles(ROLES.STUDENT), getStudent360);

// Student self-profile endpoint
router.get('/me', authorizeRoles(ROLES.STUDENT), getMyStudentProfile);

// Parent Linked Children selector endpoint
router.get(
  '/parent/my-children',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.PARENT),
  listMyChildren
);

// Administrative Parent-Student Link Management
router.get(
  '/parent-links',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  listParentLinks
);

router.post(
  '/parent-links',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  createParentLink
);

router.put(
  '/parent-links/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  updateParentLink
);

router.delete(
  '/parent-links/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  deleteParentLink
);

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

// Student 360° Profile by ID (Authorized institutional roles & linked parents)
router.get(
  '/:id/360',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.ACCOUNTS,
    ROLES.PARENT,
    ROLES.STUDENT
  ),
  getStudent360
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
