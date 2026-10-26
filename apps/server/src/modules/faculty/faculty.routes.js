const express = require('express');
const { listFaculty, getFacultyById, createFacultyProfile } = require('./faculty.controller');
const { validateFacultyInput } = require('./faculty.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

router.get('/', listFaculty);
router.get('/:id', getFacultyById);

router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateFacultyInput),
  createFacultyProfile
);

module.exports = router;

